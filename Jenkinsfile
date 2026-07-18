pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "spring-demo"
        DOCKER_TAG   = "${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Compile & Test') {
            steps {
                echo 'Building and testing application...'
                script {
                    if (isUnix()) {
                        sh 'chmod +x mvnw'
                        sh './mvnw clean package'
                    } else {
                        bat 'mvnw.cmd clean package'
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                echo 'Building Docker image...'
                script {
                    if (isUnix()) {
                        sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
                        sh "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest"
                    } else {
                        bat "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
                        bat "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest"
                    }
                }
            }
        }

        // Optional: Add Docker Push and Deploy stages if using a container registry or target host
        
        stage('Push Image') {
            steps {
                script {
                    // Check if credentials exist before trying to run this stage
                    try {
                        withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                            if (isUnix()) {
                                sh "echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin"
                                sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
                                sh "docker push ${DOCKER_IMAGE}:latest"
                            } else {
                                bat "echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin"
                                bat "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
                                bat "docker push ${DOCKER_IMAGE}:latest"
                            }
                        }
                    } catch (Exception e) {
                        echo "Skipping Push Image stage: credentials or registry connection not configured."
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying application...'
                script {
                    if (isUnix()) {
                        sh "docker compose down"
                        sh "docker compose up -d"
                    } else {
                        bat "docker compose down"
                        bat "docker compose up -d"
                    }
                }
            }
        }
        
    }

    post {
        always {
            echo 'Pipeline finished execution.'
            cleanWs()
        }
        success {
            echo 'Build and Docker Image creation succeeded!'
        }
        failure {
            echo 'Pipeline execution failed. Please check build logs.'
        }
    }
}
