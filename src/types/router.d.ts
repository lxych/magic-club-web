export {}

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    title?: string
    icon?: string
    hidden?: boolean
    adminOnly?: boolean
    requiredPermission?: string
  }
}
