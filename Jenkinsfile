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

    }

    post {
        success {
            echo 'TechCart CI stages completed successfully.'
        }

        failure {
            echo 'TechCart pipeline failed. Check the failed stage logs.'
        }
    }
}
