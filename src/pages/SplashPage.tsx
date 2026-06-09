import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export default function SplashPage() {
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      navigate("/");
    } else {
      navigate("/login");
    }
  }, [session, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Logo className="text-5xl" />
    </div>
  );
}