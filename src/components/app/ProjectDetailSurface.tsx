"use client";

import ProjectDetailPage from "@/components/pages/Projects/ProjectDetailPage";

export default function ProjectDetailSurface(props: { slug: string }) {
  return <ProjectDetailPage {...props} />;
}
