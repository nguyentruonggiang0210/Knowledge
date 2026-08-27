variable "compartment_id" {
  type = string
}

variable "name_prefix" {
  type = string
}

variable "subnet_id" {
  type = string
}

variable "nsg_id" {
  type = string
}

variable "instances" {
  description = "Stable key map of private flexible compute instances."
  type = map(object({
    availability_domain = string
    fault_domain        = optional(string)
    image_id            = string
    shape               = optional(string, "VM.Standard.E4.Flex")
    ocpus               = optional(number, 1)
    memory_in_gbs       = optional(number, 8)
  }))

  validation {
    condition = alltrue([
      for instance in values(var.instances) : endswith(lower(instance.shape), ".flex")
    ])
    error_message = "Reference compute module chỉ hỗ trợ flexible shapes."
  }
}

variable "ssh_public_key" {
  type = string
}

variable "app_port" {
  type    = number
  default = 8080
}

variable "tags" {
  type = map(string)
}

