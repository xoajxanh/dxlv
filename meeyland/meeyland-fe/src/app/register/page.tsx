"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AtSign, Eye, EyeOff, Lock, User } from "lucide-react";
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

const registerSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    displayName: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm: z.string().min(1, "Please confirm your password"),
  })
  .refine(data => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register, login } = useAuth();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", displayName: "", password: "", confirm: "" },
  });

  const onSubmit = async (values: RegisterValues) => {
    try {
      await register(values.username, values.password, values.displayName || undefined);
      await login(values.username, values.password);
      toast.success("Account created!", { description: "Welcome to Meeyland." });
      router.replace("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      toast.error("Registration failed", { description: msg });
      form.setError("root", { message: msg });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#17212B] p-6 select-none">
      <div className="w-full max-w-4xl">
        {/* Same h-[580px] as login for consistent card height */}
        <Card className="overflow-hidden p-0 bg-[#202B36] ring-[#304050]/40 rounded-2xl shadow-2xl h-[580px]">
          <CardContent className="grid p-0 md:grid-cols-2 h-full">

            {/* Left — Illustration panel */}
            <AuthIllustration
              headline="Join Meeyland today"
              subtitle="Create your account and start chatting. Join users who value privacy and fast communication."
            />

            {/* Right — Form (scrollable so all 4 fields are reachable) */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="h-full flex flex-col justify-center px-10 py-8 overflow-y-auto"
              >
                <FieldGroup>
                  {/* Heading */}
                  <div className="flex flex-col gap-1 text-center mb-1">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Create Account</h1>
                    <p className="text-sm text-slate-400">
                      Get started with your Meeyland profile
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
                            htmlFor="reg-username"
                            className="text-[10px] font-bold tracking-wider text-slate-400 uppercase"
                          >
                            Username
                          </FieldLabel>
                          <FormControl>
                            <Input
                              id="reg-username"
                              autoComplete="username"
                              placeholder="Choose a username"
                              iconLeft={<AtSign size={15} />}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </Field>
                      </FormItem>
                    )}
                  />

                  {/* Display Name */}
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <Field>
                          <FieldLabel
                            htmlFor="reg-displayname"
                            className="text-[10px] font-bold tracking-wider text-slate-400 uppercase"
                          >
                            Display Name
                          </FieldLabel>
                          <FormControl>
                            <Input
                              id="reg-displayname"
                              placeholder="Your display name"
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
                            htmlFor="reg-password"
                            className="text-[10px] font-bold tracking-wider text-slate-400 uppercase"
                          >
                            Password
                          </FieldLabel>
                          <FormControl>
                            <Input
                              id="reg-password"
                              type={showPw ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="Min 6 characters"
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

                  {/* Confirm Password */}
                  <FormField
                    control={form.control}
                    name="confirm"
                    render={({ field }) => (
                      <FormItem>
                        <Field>
                          <FieldLabel
                            htmlFor="reg-confirm"
                            className="text-[10px] font-bold tracking-wider text-slate-400 uppercase"
                          >
                            Confirm Password
                          </FieldLabel>
                          <FormControl>
                            <Input
                              id="reg-confirm"
                              type={showPw ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="Repeat your password"
                              iconLeft={<Lock size={15} />}
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
                      id="reg-submit"
                      type="submit"
                      variant="accent"
                      loading={form.formState.isSubmitting}
                      className="w-full mt-1"
                    >
                      Create Account
                    </Button>
                  </Field>

                  {/* Footer */}
                  <FieldDescription className="text-center text-slate-500">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="font-semibold text-[#3390EC] hover:text-[#4DA2F1] hover:underline underline-offset-4"
                    >
                      Sign In
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
