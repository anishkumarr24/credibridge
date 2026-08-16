import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Override providers here with the full Node-runtime version that can use Prisma + bcrypt
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Look up user by normalised email — never reveal if account exists or not
        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: {
              id: true,
              email: true,
              name: true,
              passwordHash: true,
              role: true,
            },
          });
        } catch {
          // DB error — return null with generic message
          return null;
        }

        if (!user || !user.passwordHash) {
          console.log("[AUTH DEBUG] User not found or no password hash for email:", email);
          // Perform a dummy compare to prevent timing attacks
          await bcrypt.compare(password, "$2b$12$dummyhashfortimingattackprevention00000000000000000000");
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordsMatch) {
          console.log("[AUTH DEBUG] Passwords do not match for email:", email);
          return null;
        }

        // Return only safe fields — never return passwordHash
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
