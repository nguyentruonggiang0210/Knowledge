variable "region" {
  type = string
}

variable "oci_profile" {
  type    = string
  default = "TF-LEARNING"
}

variable "compartment_id" {
  type = string
}

variable "name_prefix" {
  type    = string
  default = "tf-course"
}

variable "vcn_cidr" {
  type    = string
  default = "10.20.0.0/16"

  validation {
    condition     = can(cidrnetmask(var.vcn_cidr))
    error_message = "vcn_cidr phải là IPv4 CIDR hợp lệ."
  }
}

variable "enable_nat_gateway" {
  description = "Opt-in vì NAT Gateway có thể phát sinh phí."
  type        = bool
  default     = false
}

variable "lb_allowed_cidrs" {
  description = "CIDR được truy cập HTTP public listener."
  type        = set(string)
  default     = ["0.0.0.0/0"]
}

