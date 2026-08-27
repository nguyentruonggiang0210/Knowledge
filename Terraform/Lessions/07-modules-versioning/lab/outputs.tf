output "components" {
  value = {
    for key, component in terraform_data.component : key => component.output
  }
}

