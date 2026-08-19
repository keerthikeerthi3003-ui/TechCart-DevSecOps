pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm test'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube-TechCart') {
                    script {
                        def scannerHome = tool 'SonarQubeScanner'

                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                            -Dsonar.projectKey=TechCart \
                            -Dsonar.projectName=TechCart \
                            -Dsonar.sources=. \
                            -Dsonar.exclusions=node_modules/**,tests/**
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Snyk Dependency Scan') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'snyk-token',
                        variable: 'SNYK_TOKEN'
                    )
                ]) {
                    sh '''
                        snyk test --severity-threshold=high
                    '''
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh '''
                    docker build -t techcart:${BUILD_NUMBER} .
                '''
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh '''
                    trivy image \
                    --severity HIGH,CRITICAL \
                    --ignore-unfixed \
                    --exit-code 1 \
                    techcart:${BUILD_NUMBER}
                '''
            }
        }

        stage('Push Image to ACR') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'acr-service-principal',
                        usernameVariable: 'AZURE_CLIENT_ID',
                        passwordVariable: 'AZURE_CLIENT_SECRET'
                    ),
                    string(
                        credentialsId: 'azure-tenant-id',
                        variable: 'AZURE_TENANT_ID'
                    )
                ]) {
                    sh '''
                        az login \
                          --service-principal \
                          --username "$AZURE_CLIENT_ID" \
                          --password "$AZURE_CLIENT_SECRET" \
                          --tenant "$AZURE_TENANT_ID"

                        az acr login --name acrtechcartkeerthi

                        docker tag \
                          techcart:${BUILD_NUMBER} \
                          acrtechcartkeerthi.azurecr.io/techcart:${BUILD_NUMBER}

                        docker push \
                          acrtechcartkeerthi.azurecr.io/techcart:${BUILD_NUMBER}

                        az logout
                    '''
                }
            }
        }

        stage('Connect to AKS') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'acr-service-principal',
                        usernameVariable: 'AZURE_CLIENT_ID',
                        passwordVariable: 'AZURE_CLIENT_SECRET'
                    ),
                    string(
                        credentialsId: 'azure-tenant-id',
                        variable: 'AZURE_TENANT_ID'
                    )
                ]) {
                    sh '''
                        az login \
                          --service-principal \
                          --username "$AZURE_CLIENT_ID" \
                          --password "$AZURE_CLIENT_SECRET" \
                          --tenant "$AZURE_TENANT_ID"

                        az aks get-credentials \
                          --resource-group rg-techcart-devsecops \
                          --name aks-techcart \
                          --admin \
                          --overwrite-existing

                        kubectl get nodes
                    '''
                }
            }
        }

        stage('Create Helm Chart') {
            steps {
                sh '''
                    rm -rf helm-techcart
                    mkdir -p helm-techcart/templates

                    cat > helm-techcart/Chart.yaml <<'EOF'
apiVersion: v2
name: techcart
description: Helm chart for TechCart Node.js application
type: application
version: 1.0.0
appVersion: "1.0"
EOF

                    cat > helm-techcart/values.yaml <<EOF
replicaCount: 1

image:
  repository: acrtechcartkeerthi.azurecr.io/techcart
  tag: "${BUILD_NUMBER}"
  pullPolicy: IfNotPresent

service:
  type: LoadBalancer
  port: 80
  targetPort: 3000

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 250m
    memory: 256Mi
EOF

                    cat > helm-techcart/templates/deployment.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: techcart
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: techcart
  template:
    metadata:
      labels:
        app: techcart
    spec:
      containers:
        - name: techcart
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - containerPort: 3000
          resources:
{{ toYaml .Values.resources | indent 12 }}
EOF

                    cat > helm-techcart/templates/service.yaml <<'EOF'
apiVersion: v1
kind: Service
metadata:
  name: techcart
spec:
  type: {{ .Values.service.type }}
  selector:
    app: techcart
  ports:
    - port: {{ .Values.service.port }}
      targetPort: {{ .Values.service.targetPort }}
      protocol: TCP
EOF

                    helm lint ./helm-techcart
                '''
            }
        }

        stage('Deploy to AKS with Helm') {
            steps {
                sh '''
                    helm upgrade --install techcart ./helm-techcart \
                      --namespace default \
                      --wait \
                      --timeout 5m

                    kubectl rollout status deployment/techcart \
                      --timeout=180s

                    kubectl get pods
                    kubectl get service techcart
                '''
            }
        }

        stage('Verify AKS Deployment') {
            steps {
                sh '''
                    echo "Verifying TechCart deployment..."

                    kubectl get deployment techcart
                    kubectl get pods -l app=techcart
                    kubectl get service techcart

                    EXTERNAL_IP=$(kubectl get service techcart \
                      -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

                    echo "TechCart External IP: ${EXTERNAL_IP}"

                    if [ -n "$EXTERNAL_IP" ]; then
                        curl --fail --retry 5 --retry-delay 10 \
                          http://${EXTERNAL_IP}/api/health
                    else
                        echo "External IP is not available yet."
                        exit 1
                    fi

                    az logout
                '''
            }
        }
    }

    post {
        success {
            echo 'TechCart end-to-end DevSecOps pipeline completed successfully.'
        }

        failure {
            echo 'TechCart pipeline failed. Check the failed stage logs.'
        }
    }
}
