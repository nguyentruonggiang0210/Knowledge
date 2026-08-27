output "safety_contract" {
  value = {
    region         = var.region
    compartment_id = var.compartment_id
    vcn_cidr       = var.vcn_cidr
    tags           = local.mandatory_tags
  }
}
