import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
      Run on all routes except:
      - _next static/image
      - favicon
    */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
