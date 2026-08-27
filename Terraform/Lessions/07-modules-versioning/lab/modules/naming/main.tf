locals {
  name = "${var.application}-${var.environment}"
  tags = {
    application = var.application
    environment = var.environment
    managed_by  = "terraform"
    owner       = var.owner
  }
}

