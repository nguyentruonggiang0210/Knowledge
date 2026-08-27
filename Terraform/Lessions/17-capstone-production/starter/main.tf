locals {
  mandatory_tags = {
    environment = var.environment
    managed_by  = "terraform"
    owner       = trimspace(var.owner)
    cost_center = trimspace(var.cost_center)
  }
}

resource "terraform_data" "safety_contract" {
  input = {
    region         = var.region
    compartment_id = var.compartment_id
    vcn_cidr       = var.vcn_cidr
    tags           = local.mandatory_tags
  }

  lifecycle {
    precondition {
      condition     = local.mandatory_tags.owner != "" && local.mandatory_tags.cost_center != ""
      error_message = "owner và cost_center là bắt buộc."
    }
  }
}

# TODO 1: module network
# TODO 2: module compute/instance pool với private VNIC
# TODO 3: LB/health/TLS
# TODO 4: data/Vault/monitoring/budget
# TODO 5: tests, policy, CI và runbooks

