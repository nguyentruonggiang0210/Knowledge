variable "environment" {
  type    = string
  default = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment phải là dev, staging hoặc prod."
  }
}

variable "region" {
  type = string
}

variable "compartment_id" {
  type = string
}

variable "vcn_cidr" {
  type    = string
  default = "10.70.0.0/16"

  validation {
    condition     = can(cidrnetmask(var.vcn_cidr))
    error_message = "vcn_cidr không hợp lệ."
  }
}

variable "owner" {
  type = string
}

variable "cost_center" {
  type = string
}

