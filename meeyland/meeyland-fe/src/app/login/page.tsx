"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/AuthContext";
import { AuthIllustration } from "@/components/AuthIllustration";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      await login(values.username, values.password);
      toast.success("Welcome back!", { description: "You are now signed in." });
      router.replace("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      toast.error("Sign in failed", { description: msg });
      form.setError("root", { message: msg });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#17212B] p-6 select-none">
      <div className="w-full max-w-4xl">
        <Card className="overflow-hidden p-0 bg-[#202B36] ring-[#304050]/40 rounded-2xl shadow-2xl h-[580px]">
          <CardContent className="grid p-0 md:grid-cols-2 h-full">

            {/* Left — Illustration panel */}
            <AuthIllustration
              headline="Welcome back to Meeyland"
              subtitle="Secure messaging. Fast. Modern. Experience the next level of chat communication."
            />

            {/* Right — Form */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="h-full flex flex-col justify-center px-10 py-10"
              >
                <FieldGroup>
                  {/* Heading */}
                  <div className="flex flex-col gap-1.5 text-center mb-2">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Sign In</h1>
                    <p className="text-sm text-slate-400">
                      Access your secure messaging workspace
                    </p>
                  </div>

                  {/* Username */}
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <Field>
                          <FieldLabel
                            htmlFor="login-username"
                            className="text-[10px] font-bold tracking-wider text-slate-400 uppercase"
                          >
                            Username
                          </FieldLabel>
                          <FormControl>
                            <Input
                              id="login-username"
                              autoComplete="username"
                              placeholder="Enter your username"
                              iconLeft={<User size={15} />}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </Field>
                      </FormItem>
                    )}
                  />

                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <Field>
                          <FieldLabel
                            htmlFor="login-password"
                            className="text-[10px] font-bold tracking-wider text-slate-400 uppercase"
                          >
                            Password
                          </FieldLabel>
                          <FormControl>
                            <Input
                              id="login-password"
                              type={showPw ? "text" : "password"}
                              autoComplete="current-password"
                              placeholder="Enter your password"
                              iconLeft={<Lock size={15} />}
                              iconRight={
                                <button
                                  type="button"
                                  onClick={() => setShowPw(v => !v)}
                                  className="transition-opacity hover:opacity-80 cursor-pointer outline-none border-none bg-transparent"
                                >
                                  {showPw
                                    ? <EyeOff size={15} className="text-slate-500 hover:text-white transition-colors" />
                                    : <Eye    size={15} className="text-slate-500 hover:text-white transition-colors" />}
                                </button>
                              }
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </Field>
                      </FormItem>
                    )}
                  />

                  {/* Root error */}
                  {form.formState.errors.root && (
                    <p className="text-xs text-center rounded-xl py-2.5 px-4 bg-red-950/40 text-red-400 border border-red-900/30 font-medium">
                      {form.formState.errors.root.message}
                    </p>
                  )}

                  {/* Submit */}
                  <Field>
                    <Button
                      id="login-submit"
                      type="submit"
                      variant="accent"
                      loading={form.formState.isSubmitting}
                      className="w-full mt-2"
                    >
                      Sign In
                    </Button>
                  </Field>

                  {/* Footer */}
                  <FieldDescription className="text-center text-slate-500">
                    New here?{" "}
                    <Link
                      href="/register"
                      className="font-semibold text-[#3390EC] hover:text-[#4DA2F1] hover:underline underline-offset-4"
                    >
                      Create an account
                    </Link>
                  </FieldDescription>
                </FieldGroup>
              </form>
            </Form>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
