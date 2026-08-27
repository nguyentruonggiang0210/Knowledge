variable "region" {
  description = "OCI region identifier, ví dụ ap-singapore-1."
  type        = string
}

variable "compartment_id" {
  description = "Compartment OCID dùng cho data source."
  type        = string

  validation {
    condition     = startswith(var.compartment_id, "ocid1.compartment.")
    error_message = "compartment_id phải là OCI compartment OCID."
  }
}

variable "oci_profile" {
  description = "Profile trong OCI config file ở máy local."
  type        = string
  default     = "DEFAULT"
}

