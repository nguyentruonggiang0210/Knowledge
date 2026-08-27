provider "oci" {
  region = var.region
  auth   = var.oci_auth

  config_file_profile = contains(["APIKey", "SecurityToken"], var.oci_auth) ? var.oci_profile : null
}

