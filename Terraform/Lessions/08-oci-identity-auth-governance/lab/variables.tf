variable "region" {
  type = string
}

variable "home_region" {
  description = "Home region của tenancy cho IAM operations."
  type        = string
}

variable "oci_profile" {
  type    = string
  default = "TF-LEARNING"
}

variable "parent_compartment_id" {
  description = "Parent compartment OCID."
  type        = string
}

variable "create_compartment" {
  description = "Opt-in vì cần IAM privilege và tạo resource thật."
  type        = bool
  default     = false
}

variable "name_prefix" {
  type    = string
  default = "tf-course"
}

