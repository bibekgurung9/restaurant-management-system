export function pageQuery(pageNo: string) {
	return pageNo ? `page=${pageNo}` : "";
}

export function limitQuery(limit: string) {
	return limit ? `limit=${limit}` : "";
}
