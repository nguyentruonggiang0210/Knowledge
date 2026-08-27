resource "oci_core_instance" "this" {
  for_each = var.instances

  availability_domain  = each.value.availability_domain
  fault_domain         = each.value.fault_domain
  compartment_id       = var.compartment_id
  display_name         = "${var.name_prefix}-${each.key}"
  shape                = each.value.shape
  preserve_boot_volume = false
  freeform_tags        = merge(var.tags, { instance_key = each.key })

  shape_config {
    ocpus         = each.value.ocpus
    memory_in_gbs = each.value.memory_in_gbs
  }

  create_vnic_details {
    subnet_id        = var.subnet_id
    assign_public_ip = false
    hostname_label   = substr(replace(each.key, "-", ""), 0, 15)
    nsg_ids          = [var.nsg_id]
  }

  source_details {
    source_type             = "image"
    source_id               = each.value.image_id
    boot_volume_size_in_gbs = 50
    boot_volume_vpus_per_gb = 10
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data = base64encode(templatefile("${path.module}/cloud-init/app.yaml.tftpl", {
      app_port = var.app_port
    }))
  }
}

