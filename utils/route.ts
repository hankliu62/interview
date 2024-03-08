/**
 * 获取路由前缀
 * @returns
 */
export function getRoutePrefix(): string {
  return process.env.ROUTE_PREFIX || "";
}
