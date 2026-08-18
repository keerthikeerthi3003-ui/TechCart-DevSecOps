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
    }

    post {
        success {
            echo 'TechCart CI and security stages completed successfully.'
        }

        failure {
            echo 'TechCart pipeline failed. Check the failed stage logs.'
        }
    }
}
