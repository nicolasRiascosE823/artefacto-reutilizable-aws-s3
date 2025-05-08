# **S3 File Manager** - Artefacto Reutilizable para Node.js y AWS

## Descripción

**S3 File Manager** es un artefacto reutilizable para gestionar archivos en AWS S3 de manera sencilla y eficiente. Implementado utilizando TypeScript, Node.js, AWS SDK y arquitectura hexagonal, este artefacto permite cargar y leer archivos de S3 de manera segura y flexible, siguiendo las mejores prácticas de desarrollo.

Este artefacto está diseñado para ser fácilmente integrado en proyectos Node.js que requieren la interacción con Amazon S3 para subir y consultar archivos.

## Características

- **Cargar archivos**: Permite cargar archivos a S3 con un nombre y contenido especificados.
- **Leer archivos**: Permite leer archivos almacenados en S3.
- **Arquitectura hexagonal**: Separación clara entre la lógica de negocio y la infraestructura.
- **Modularidad**: Fácil de integrar en cualquier proyecto.
- **Pruebas unitarias**: Cubre el 100% de las pruebas con Jest.
- **Cumple con las mejores prácticas**: Incluye ESLint, buenas prácticas de programación y estructura de código limpio.

## Requisitos

- Node.js >= v16
- AWS SDK para JavaScript
- Un bucket de S3 en AWS
- Cuenta de AWS con permisos adecuados para interactuar con S3

## Instalación

### 1. Instalación vía NPM

Si planeas integrar el artefacto en un proyecto, puedes instalarlo directamente desde NPM (o desde tu repositorio privado si así lo deseas).

```bash
npm install s3-file-manager-package
