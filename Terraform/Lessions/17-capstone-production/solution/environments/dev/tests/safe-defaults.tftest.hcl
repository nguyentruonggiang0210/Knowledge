mock_provider "oci" {}

run "safe_defaults_create_no_compute_or_lb" {
  command = plan

  variables {
    region               = "ap-singapore-1"
    compartment_id       = "ocid1.compartment.oc1..example"
    oci_auth             = "APIKey"
    oci_profile          = "TF-LEARNING"
    name_prefix          = "payments"
    vcn_cidr             = "10.70.0.0/16"
    enable_nat_gateway   = false
    enable_compute       = false
    enable_load_balancer = false
    lb_ingress_cidrs     = ["0.0.0.0/0"]
    instances            = {}
    ssh_public_key       = null
    owner                = "platform-team"
    cost_center          = "learning"
  }

  assert {
    condition     = length(output.instances) == 0
    error_message = "Safe defaults không được tạo compute."
  }

  assert {
    condition     = output.load_balancer == null
    error_message = "Safe defaults không được tạo load balancer."
  }
}

