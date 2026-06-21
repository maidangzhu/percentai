import { NextResponse } from "next/server";

export interface ApiResponse<T> {
  code: number | string;
  message: string;
  data: T;
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiResponse<T>>({ code: 0, message: "ok", data }, init);
}

export function fail(status: number, message: string, code: number | string = status, data: unknown = null) {
  return NextResponse.json<ApiResponse<unknown>>({ code, message, data }, { status });
}
