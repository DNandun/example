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
                // Grant execution permission to Maven Wrapper (on Unix agents)
                sh 'chmod +x mvnw'
                // Run clean package using the Maven wrapper
                sh './mvnw clean package'
            }
        }

        stage('Docker Build') {
            steps {
                echo 'Building Docker image...'
                sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
                sh "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest"
            }
        }

        // Optional: Add Docker Push and Deploy stages if using a container registry or target host
        /*
        stage('Push Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                    sh "echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin"
                    sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
                    sh "docker push ${DOCKER_IMAGE}:latest"
                }
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying application...'
                // Example: Restart using docker-compose
                sh "docker compose down"
                sh "docker compose up -d"
            }
        }
        */
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
