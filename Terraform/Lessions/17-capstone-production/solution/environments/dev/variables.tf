variable "region" {
  type = string
}

variable "compartment_id" {
  type = string
}

variable "oci_auth" {
  type    = string
  default = "APIKey"

  validation {
    condition = contains([
      "APIKey",
      "SecurityToken",
      "InstancePrincipal",
      "ResourcePrincipal",
      "OKEWorkloadIdentity"
    ], var.oci_auth)
    error_message = "oci_auth không thuộc danh sách auth được course hỗ trợ."
  }
}

variable "oci_profile" {
  type    = string
  default = "TF-LEARNING"
}

variable "name_prefix" {
  type    = string
  default = "payments"
}

variable "vcn_cidr" {
  type = string
}

variable "enable_nat_gateway" {
  type    = bool
  default = false
}

variable "enable_compute" {
  type    = bool
  default = false
}

variable "enable_load_balancer" {
  type    = bool
  default = false
}

variable "lb_ingress_cidrs" {
  type    = set(string)
  default = ["0.0.0.0/0"]
}

variable "instances" {
  type = map(object({
    availability_domain = string
    fault_domain        = optional(string)
    image_id            = string
    shape               = optional(string, "VM.Standard.E4.Flex")
    ocpus               = optional(number, 1)
    memory_in_gbs       = optional(number, 8)
  }))
  default = {}
}

variable "ssh_public_key" {
  type     = string
  default  = null
  nullable = true
}

variable "owner" {
  type = string
}

variable "cost_center" {
  type = string
}

