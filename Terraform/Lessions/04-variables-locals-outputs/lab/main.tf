locals {
  name_prefix = "${var.application.name}-${var.environment}"
  mandatory_tags = {
    environment = var.environment
    managed_by  = "terraform"
    owner       = trimspace(var.application.owner)
  }
}

resource "terraform_data" "application_contract" {
  input = {
    name           = local.name_prefix
    instance_count = var.application.instance_count
    public         = var.application.public
    tags           = local.mandatory_tags
  }

  lifecycle {
    precondition {
      condition     = local.mandatory_tags.owner != ""
      error_message = "owner không được rỗng."
    }

    precondition {
      condition     = var.environment != "prod" || !var.application.public
      error_message = "Lab không cho phép public application trong prod."
    }
  }
}

