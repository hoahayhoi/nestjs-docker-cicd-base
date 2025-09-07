def deploy(sshUser, sshHost) {
    sh """
        ssh -o StrictHostKeyChecking=no ${sshUser}@${sshHost} << 'EOF'
            cd ${APP_DIR}
            eval \$(ssh-agent -s)
            ssh-add ~/.ssh/id_rsa_github
            ./deploy.sh
EOF
    """
}

pipeline {
    agent any

    environment {
        NODE_ENV = 'development'
        DISCORD_WEBHOOK = credentials('DISCORD_WEBHOOK')
        APP_DIR = credentials('APP_DIR')
        APP_NAME_DEV = credentials('APP_NAME_DEV')
        PM2_PATH = credentials('PM2_PATH')
        SSH_USER = credentials('SSH_USER')
        SSH_HOST = credentials('SSH_HOST')
    }

    stages {
        stage('Verify SSH Connection') {
            steps {
                sshagent(credentials: ['REPAIR_BOOKING_SSH']) {
                    sh """
                    ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} "node -v && npm -v"
                    """
                }
            }
        }

        stage('Checkout code') {
            steps {

                script{
                checkout scm

                echo '🚀 Bắt đầu quá trình deploy'
                discordSend(
                        webhookURL: env.DISCORD_WEBHOOK,
                        title: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                        description: "🚀 Project *bao-tri-dev* đang được deploy vào môi trường development\n**Branch**: ${env.GIT_BRANCH ?: 'N/A'}",
                        link: env.BUILD_URL,
                        result: 'INFO', // Trạng thái trung lập khi bắt đầu
                        footer: "Started at ${new Date().toString()}"
                    )

                }
                
            }
        }

        stage('Install dependencies') {
            steps {
                nodejs('Node'){
                    echo 'Install dependency'
                    sh '''
                        set -eux
                        rm -rf node_modules
                        npm cache clean --force
                        npm ci
                        '''
                }
            }
        }

        stage('Prisma Generate') {
            steps {
                nodejs('Node') {
                    echo 'Generating Prisma Client'
                    sh 'npx prisma generate'
                }
            }
        }


        stage('Build project') {
            steps {
                nodejs('Node'){
                    echo 'Building application'
                    sh 'npm run build'
                }
            }
        }


        stage('Deploy') {
            steps {
                sshagent(credentials: ['REPAIR_BOOKING_SSH']) {
                    echo 'Deploy'
                    deploy(SSH_USER, SSH_HOST)
                }
            }
        }
    }

    post {
        success {
            cleanWs()
            echo '✅ CI/CD thành công!'
            discordSend(
                webhookURL: env.DISCORD_WEBHOOK,
                title: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                description: "✅ Project *bao-tri-dev* đã được deploy thành công vào môi trường development\n**Branch**: ${env.GIT_BRANCH ?: 'N/A'}",
                link: env.BUILD_URL,
                result: 'SUCCESS',
                footer: "Completed at ${new Date().toString()}"
            )
        }

        failure {
            cleanWs()
            echo '❌ CI/CD thất bại!'
            discordSend(
                webhookURL: env.DISCORD_WEBHOOK,
                title: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER}",
                description: "❌ Project *bao-tri-dev* deploy thất bại. Vui lòng kiểm tra log!\n**Branch**: ${env.GIT_BRANCH ?: 'N/A'}",
                link: env.BUILD_URL,
                result: 'FAILURE',
                footer: "Failed at ${new Date().toString()}"
            )        
        }

        always {
            cleanWs()
        }
    }
}
