 pipeline {

    agent any

    stages {
      stage(‘Build’) {
        steps {
          sh 'docker system prune -a --volumes && docker-compose -f docker-compose.yml --compatibility up -d --build'
        }
      }
    }
    
}