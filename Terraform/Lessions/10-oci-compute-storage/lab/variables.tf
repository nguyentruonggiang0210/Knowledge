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

variable "create_instance" {
  description = "Opt-in tạo compute có tính phí/quota."
  type        = bool
  default     = false
}

variable "availability_domain" {
  type     = string
  default  = null
  nullable = true
}

variable "subnet_id" {
  type     = string
  default  = null
  nullable = true
}

variable "nsg_ids" {
  type    = list(string)
  default = []
}

variable "image_id" {
  type     = string
  default  = null
  nullable = true
}

variable "shape" {
  type    = string
  default = "VM.Standard.E4.Flex"
}

variable "ocpus" {
  type    = number
  default = 1
}

variable "memory_in_gbs" {
  type    = number
  default = 8
}

variable "ssh_public_key" {
  description = "Chỉ public key OpenSSH; không truyền private key."
  type        = string
  default     = null
  nullable    = true
}

variable "create_bucket" {
  description = "Opt-in tạo Object Storage bucket."
  type        = bool
  default     = false
}

variable "bucket_name" {
  description = "Tên bucket unique trong namespace."
  type        = string
  default     = "replace-with-unique-tf-course-bucket"
}

