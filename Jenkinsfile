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
    }

    post {
        success {
            echo 'TechCart CI, security, Docker, and ACR stages completed successfully.'
        }

        failure {
            echo 'TechCart pipeline failed. Check the failed stage logs.'
        }
    }
}
