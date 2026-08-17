"use client";
import dynamic from "next/dynamic";
import NerddingInteractionLayer from "@/components/app/NerddingInteractionLayer";
import ProfileHistoryLayer from "@/components/app/ProfileHistoryLayer";
import SettingsRoleUpgradeLayer from "@/components/app/SettingsRoleUpgradeLayer";

const ClientAppGate = dynamic(() => import("./ClientAppGate"), { ssr:false, loading:()=> <div style={{minHeight:"100dvh",background:"#f8f6f2"}} aria-hidden="true"/> });
export default function Page(){return <><ClientAppGate/><NerddingInteractionLayer/><ProfileHistoryLayer/><SettingsRoleUpgradeLayer/></>}
