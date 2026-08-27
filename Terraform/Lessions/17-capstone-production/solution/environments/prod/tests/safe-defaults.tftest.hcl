mock_provider "oci" {}

run "safe_production_defaults" {
  command = plan

  variables {
    region               = "ap-singapore-1"
    compartment_id       = "ocid1.compartment.oc1..example"
    oci_auth             = "APIKey"
    oci_profile          = "TF-PROD"
    name_prefix          = "payments"
    vcn_cidr             = "10.80.0.0/16"
    enable_nat_gateway   = false
    enable_compute       = false
    enable_load_balancer = false
    lb_ingress_cidrs     = ["0.0.0.0/0"]
    instances            = {}
    ssh_public_key       = null
    owner                = "platform-team"
    cost_center          = "payments"
  }

  assert {
    condition     = length(output.instances) == 0 && output.load_balancer == null
    error_message = "Production safe defaults không được tạo compute/LB."
  }
}

