variable "environment" {
  type = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment phải là dev, staging hoặc prod."
  }
}

variable "compartment_id" {
  type = string
}

variable "name_prefix" {
  type = string
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

variable "app_port" {
  type    = number
  default = 8080
}

variable "data_port" {
  type    = number
  default = 1522
}

