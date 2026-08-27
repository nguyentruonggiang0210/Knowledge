output "created_resources" {
  value = {
    instance_id = try(oci_core_instance.learning[0].id, null)
    private_ip  = try(oci_core_instance.learning[0].private_ip, null)
    bucket_name = try(oci_objectstorage_bucket.learning[0].name, null)
  }
}

