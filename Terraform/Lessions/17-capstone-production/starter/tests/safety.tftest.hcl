run "valid_safety_contract" {
  command = plan

  variables {
    environment    = "dev"
    region         = "ap-singapore-1"
    compartment_id = "ocid1.compartment.oc1..example"
    vcn_cidr       = "10.70.0.0/16"
    owner          = "platform-team"
    cost_center    = "learning"
  }

  assert {
    condition     = output.safety_contract.tags.managed_by == "terraform"
    error_message = "managed_by tag bị thiếu."
  }
}

