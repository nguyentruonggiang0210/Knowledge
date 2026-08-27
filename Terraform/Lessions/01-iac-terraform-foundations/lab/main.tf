locals {
  message = "hello-${lower(var.environment)}"
}

resource "terraform_data" "first_resource" {
  input = {
    environment = var.environment
    message     = local.message
    managed_by  = "terraform"
  }
}

