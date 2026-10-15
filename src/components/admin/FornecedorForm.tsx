"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SupplierFormProps {
  supplier?: {
    id: string;
    name: string;
    contact: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
    is_active: boolean;
  };
}

export default function SupplierForm({ supplier }: SupplierFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    name: supplier?.name || "",
    contact: supplier?.contact || "",
    phone: supplier?.phone || "",
    email: supplier?.email || "",
    address: supplier?.address || "",
    notes: supplier?.notes || "",
    is_active: supplier?.is_active ?? true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (supplier?.id) {
      await supabase.from("suppliers").update(form).eq("id", supplier.id);
    } else {
      await supabase.from("suppliers").insert(form);
    }

    router.push("/admin/fornecedores");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <input
        name="name"
        placeholder="Name"
        value={form.name}
        onChange={handleChange}
        className="input"
      />

      <input
        name="contact"
        placeholder="Contact"
        value={form.contact}
        onChange={handleChange}
        className="input"
      />

      <input
        name="phone"
        placeholder="Phone"
        value={form.phone}
        onChange={handleChange}
        className="input"
      />

      <input
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        className="input"
      />

      <input
        name="address"
        placeholder="Address"
        value={form.address}
        onChange={handleChange}
        className="input"
      />

      <textarea
        name="notes"
        placeholder="Notes"
        value={form.notes}
        onChange={handleChange}
        className="textarea"
      />

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_active"
          checked={form.is_active}
          onChange={handleChange}
        />
        Active
      </label>

      <button type="submit" className="btn-primary">
        {supplier ? "Update Supplier" : "Create Supplier"}
      </button>
    </form>
  );
}
