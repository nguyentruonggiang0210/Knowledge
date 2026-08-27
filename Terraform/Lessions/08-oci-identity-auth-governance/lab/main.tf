locals {
  governance_tags = {
    environment = "learning"
    managed_by  = "terraform"
    owner       = "student"
  }
}

resource "oci_identity_compartment" "learning" {
  count    = var.create_compartment ? 1 : 0
  provider = oci.home

  compartment_id = var.parent_compartment_id
  name           = "${var.name_prefix}-learning"
  description    = "Isolated compartment for Terraform course labs"
  enable_delete  = true
  freeform_tags  = local.governance_tags
}

resource "terraform_data" "governance_contract" {
  input = {
    compartment_id = var.create_compartment ? oci_identity_compartment.learning[0].id : var.parent_compartment_id
    tags           = local.governance_tags
    home_region    = var.home_region
  }
}

