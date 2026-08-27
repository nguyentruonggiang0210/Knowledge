package devops.kubernetes

import rego.v1

deny contains message if {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  endswith(container.image, ":latest")
  message := sprintf("container %q must not use the mutable latest tag", [container.name])
}

deny contains message if {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  not input.spec.template.spec.securityContext.runAsNonRoot
  message := sprintf("container %q requires pod runAsNonRoot", [container.name])
}

deny contains message if {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  not container.securityContext.readOnlyRootFilesystem
  message := sprintf("container %q requires a read-only root filesystem", [container.name])
}

deny contains message if {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[_]
  not "ALL" in container.securityContext.capabilities.drop
  message := sprintf("container %q must drop all Linux capabilities", [container.name])
}
