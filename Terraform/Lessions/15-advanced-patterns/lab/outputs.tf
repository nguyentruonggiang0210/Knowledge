output "deployments" {
  value = {
    for key, deployment in terraform_data.deployment : key => deployment.output
  }
}

