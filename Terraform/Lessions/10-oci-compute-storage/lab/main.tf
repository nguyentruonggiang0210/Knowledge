locals {
  tags = {
    environment = "learning"
    managed_by  = "terraform"
    owner       = "student"
  }
}

data "oci_objectstorage_namespace" "current" {
  count          = var.create_bucket ? 1 : 0
  compartment_id = var.compartment_id
}

resource "oci_objectstorage_bucket" "learning" {
  count = var.create_bucket ? 1 : 0

  compartment_id = var.compartment_id
  namespace      = data.oci_objectstorage_namespace.current[0].namespace
  name           = var.bucket_name
  access_type    = "NoPublicAccess"
  storage_tier   = "Standard"
  versioning     = "Enabled"
  freeform_tags  = local.tags
}

resource "oci_core_instance" "learning" {
  count = var.create_instance ? 1 : 0

  availability_domain  = var.availability_domain
  compartment_id       = var.compartment_id
  display_name         = "${var.name_prefix}-instance"
  shape                = var.shape
  preserve_boot_volume = false
  freeform_tags        = local.tags

  shape_config {
    ocpus         = var.ocpus
    memory_in_gbs = var.memory_in_gbs
  }

  create_vnic_details {
    subnet_id        = var.subnet_id
    assign_public_ip = false
    hostname_label   = "app"
    nsg_ids          = var.nsg_ids
  }

  source_details {
    source_type             = "image"
    source_id               = var.image_id
    boot_volume_size_in_gbs = 50
    boot_volume_vpus_per_gb = 10
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data = base64encode(templatefile("${path.module}/cloud-init/app.yaml.tftpl", {
      app_port = 8080
    }))
  }

  lifecycle {
    precondition {
      condition = alltrue([
        var.availability_domain != null,
        var.subnet_id != null,
        var.image_id != null,
        var.ssh_public_key != null
      ])
      error_message = "Khi create_instance=true phải cung cấp AD, subnet_id, image_id và SSH public key."
    }
  }
}

