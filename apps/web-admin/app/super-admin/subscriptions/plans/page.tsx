"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { getPlans, createPlan, updatePlan, deletePlan } from "@/lib/api/subscriptions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatThousandsInput } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    currency: "NGN",
    billingCycle: "MONTHLY",
    targetAudience: "ORGANIZER",
    features: [] as string[],
    isActive: true,
  });

  const [featureInput, setFeatureInput] = useState("");

  const fetchAllPlans = async () => {
    try {
      setLoading(true);
      const data = await getPlans();
      setPlans(data);
    } catch (error) {
      console.error("Failed to load plans", error);
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPlans();
  }, []);

  const handleOpenModal = (plan: any = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || "",
        amount: plan.amount.toString(),
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        targetAudience: plan.targetAudience,
        features: plan.features || [],
        isActive: plan.isActive,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: "",
        description: "",
        amount: "",
        currency: "NGN",
        billingCycle: "MONTHLY",
        targetAudience: "ORGANIZER",
        features: [],
        isActive: true,
      });
    }
    setFeatureInput("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading(editingPlan ? "Updating plan..." : "Creating plan...");
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount.replace(/,/g, "")),
      };

      if (editingPlan) {
        await updatePlan(editingPlan.id, payload);
        toast.success("Plan updated successfully", { id: toastId });
      } else {
        await createPlan(payload);
        toast.success("Plan created successfully", { id: toastId });
      }
      handleCloseModal();
      fetchAllPlans();
    } catch (error) {
      console.error("Failed to save plan", error);
      toast.error("Error saving plan. Ensure name is unique.", { id: toastId });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    const toastId = toast.loading("Deleting plan...");
    try {
      await deletePlan(id);
      toast.success("Plan deleted successfully", { id: toastId });
      fetchAllPlans();
    } catch (error) {
      console.error("Failed to delete plan", error);
      toast.error("Failed to delete plan", { id: toastId });
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col p-6 space-y-6">
      <Card className="border-none shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] overflow-hidden bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pb-6">
          <h2 className="text-zinc-700 text-xl font-medium whitespace-nowrap">Subscription Plans</h2>
          <Button onClick={() => handleOpenModal()} className="h-10 bg-[#15803D] hover:bg-[#166534] border border-openclub-800/30 text-white gap-2 rounded-lg px-4 text-[14px] font-normal">
            <Plus className="w-4 h-4" />
            CREATE PLAN
          </Button>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f5faf6] border-b border-[#e1efe5] text-[10px] font-normal text-[#15803D] uppercase tracking-wider">
                  <th className="px-6 py-4">Plan Name</th>
                  <th className="px-6 py-4">Audience</th>
                  <th className="px-6 py-4">Billing Cycle</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1efe5]">
                {plans.length > 0 ? (
                  plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col min-w-0">
                          <span className="text-slate-900 text-[14px] font-medium whitespace-nowrap">{plan.name}</span>
                          <span className="text-gray-500 text-[12px] font-normal truncate max-w-[300px] mt-0.5 mb-2">{plan.description}</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {plan.features.slice(0, 3).map((feature: string, idx: number) => (
                              <span key={idx} className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium px-2 py-0.5 rounded-full truncate max-w-[120px]">
                                {feature}
                              </span>
                            ))}
                            {plan.features.length > 3 && (
                              <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-medium px-2 py-0.5 rounded-full">
                                +{plan.features.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[13px] text-gray-600 font-medium capitalize">{plan.targetAudience.toLowerCase()}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[13px] text-gray-600 font-medium capitalize">{plan.billingCycle.toLowerCase()}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[14px] font-medium text-slate-900 whitespace-nowrap">
                          {formatCurrency(plan.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={cn(
                            "text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1.5",
                            plan.isActive ? "bg-[#f5faf6] text-[#15803D] border border-[#e1efe5]" : "bg-gray-100 text-gray-500 border border-gray-200"
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", plan.isActive ? "bg-[#15803D]" : "bg-gray-400")} />
                          {plan.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleOpenModal(plan)} className="h-7 w-7 inline-flex items-center justify-center rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200" title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(plan.id)} className="h-7 w-7 inline-flex items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-200" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : loading ? (
                  <>{[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="border-b border-[#e1efe5]">
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-4 w-36 rounded" />
                          <Skeleton className="h-3 w-56 rounded" />
                          <div className="flex gap-1.5 mt-1">
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-5 w-24 rounded-full" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5"><Skeleton className="h-4 w-20 rounded" /></td>
                      <td className="px-6 py-5"><Skeleton className="h-4 w-16 rounded" /></td>
                      <td className="px-6 py-5"><Skeleton className="h-4 w-24 rounded" /></td>
                      <td className="px-6 py-5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <Skeleton className="h-7 w-7 rounded-md" />
                          <Skeleton className="h-7 w-7 rounded-md" />
                        </div>
                      </td>
                    </tr>
                  ))}</>
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-gray-500 font-normal text-[13px]">
                      No subscription plans found. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{editingPlan ? "Edit Plan" : "Create Plan"}</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">Plan Name *</label>
                <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Professional" className="h-10 text-[14px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Amount *</label>
                  <Input required type="text" value={formData.amount} onChange={(e) => setFormData({...formData, amount: formatThousandsInput(e.target.value)})} placeholder="150,000" className="h-10 text-[14px]" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Currency</label>
                  <Input required value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} className="h-10 text-[14px]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Audience</label>
                  <select value={formData.targetAudience} onChange={(e) => setFormData({...formData, targetAudience: e.target.value})} className="w-full h-10 px-3 py-2 text-[14px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                    <option value="ORGANIZER">Organizer</option>
                    <option value="PLAYER">Player</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Billing Cycle</label>
                  <select value={formData.billingCycle} onChange={(e) => setFormData({...formData, billingCycle: e.target.value})} className="w-full h-10 px-3 py-2 text-[14px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent">
                    <option value="MONTHLY">Monthly</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Detailed description of the plan" className="w-full h-20 px-3 py-2 text-[14px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-y" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">Features *</label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Input 
                      value={featureInput} 
                      onChange={(e) => setFeatureInput(e.target.value)} 
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (featureInput.trim()) {
                            setFormData({...formData, features: [...formData.features, featureInput.trim()]});
                            setFeatureInput("");
                          }
                        }
                      }}
                      placeholder="Type a feature and press Enter" 
                      className="h-10 text-[14px]" 
                    />
                    <Button 
                      type="button"
                      onClick={() => {
                        if (featureInput.trim()) {
                          setFormData({...formData, features: [...formData.features, featureInput.trim()]});
                          setFeatureInput("");
                        }
                      }}
                      className="h-10 px-4 bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      Add
                    </Button>
                  </div>
                  {formData.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.features.map((feature, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 bg-[#f5faf6] text-[#15803D] border border-[#e1efe5] text-[12px] font-medium px-2.5 py-1 rounded-md">
                          {feature}
                          <button type="button" onClick={() => setFormData({...formData, features: formData.features.filter((_, i) => i !== idx)})} className="hover:text-red-500 focus:outline-none">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <Button type="button" variant="outline" onClick={handleCloseModal} className="h-10 px-4">Cancel</Button>
                <Button type="submit" className="h-10 px-6 bg-[#15803D] hover:bg-[#15803D]/90 text-white">{editingPlan ? "Update" : "Create"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
