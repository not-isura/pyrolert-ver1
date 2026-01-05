"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ChevronDown, ChevronRight, Edit, Save, X } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

export default function Terms() {
  const router = useRouter();
  const { toast } = useToast();
  const { canEditTerms } = usePermissions();
  
  // Track which sections are open
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({
    1: true, // First section open by default
  });

  // Track which section is being edited
  const [editingSection, setEditingSection] = useState<number | null>(null);

  // Editable content state
  const [editableContent, setEditableContent] = useState<Record<number, string>>({});

  const toggleSection = (sectionId: number) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const startEditing = (sectionId: number, currentContent: string) => {
    setEditingSection(sectionId);
    setEditableContent(prev => ({
      ...prev,
      [sectionId]: currentContent
    }));
  };

  const cancelEditing = () => {
    setEditingSection(null);
  };

  const saveSection = (sectionId: number) => {
    // Update the section content
    const updatedContent = editableContent[sectionId];
    const sectionIndex = termsContent.findIndex(s => s.id === sectionId);
    if (sectionIndex !== -1) {
      termsContent[sectionIndex].content = updatedContent;
    }
    
    setEditingSection(null);
    toast({
      title: "Section Updated",
      description: "Your changes have been saved.",
    });
  };

  // Terms content organized by sections
  const termsContent = [
    {
      id: 1,
      title: "Acceptance of Terms",
      content: `By accessing and using Pyrolert's intelligent smoke detection and occupancy monitoring system, you agree to be bound by these Terms and Conditions. Your continued use of the system constitutes acceptance of these terms and any modifications made to them.

If you do not agree with any part of these terms, you must immediately cease using the system and notify the system's administrator.`
    },
    {
      id: 2,
      title: "System Usage",
      content: `Users must operate the system in accordance with all applicable laws and regulations regarding fire safety and occupancy monitoring. The system is designed to supplement, not replace, existing safety protocols.

Users are responsible for:
• Maintaining the confidentiality of their login credentials
• Using the system only for authorized purposes
• Reporting any system malfunctions immediately
• Following emergency protocols when alerted by the system`
    },
    {
      id: 3,
      title: "Data Collection and Monitoring",
      content: `The system continuously collects environmental and occupancy data including but not limited to:

• Temperature readings and trends
• Air quality measurements (CO, NO₂, O₂, PM2.5, PM10)
• Occupancy counts and movement patterns
• Camera snapshots for verification purposes
• Sensor connection status and health metrics

All data is collected for safety monitoring, system optimization, and emergency response purposes.`
    },
    {
      id: 4,
      title: "Privacy and Data Protection",
      content: `The developers of Pyrolert are committed to protecting your privacy and handling data responsibly:

• All collected data is stored securely using industry-standard encryption
• Personal information is kept confidential and used solely for system operation
• Data access is restricted to authorized personnel only
• We comply with applicable data protection regulations
• Camera snapshots are stored temporarily and used only for safety verification
• We do not sell or share your data with third parties

Users have the right to request access to their personal data stored in the system.`
    },
    {
      id: 5,
      title: "Emergency Response and Notifications",
      content: `The system provides real-time alerts for potential fire hazards and safety concerns:

• Users will receive notifications based on their role and assigned locations
• Alert levels (Normal, Warning, High Alert) indicate urgency
• Users must respond promptly to high-priority alerts
• The system does not replace emergency services (e.g., BFP and/or local emergency numbers)
• In case of emergency, always follow established evacuation procedures

False alarms should be reported through the system for record-keeping purposes.`
    },
    {
      id: 6,
      title: "User Responsibilities",
      content: `All users of the system are expected to:

• Maintain active and accurate contact information
• Respond to system alerts in a timely manner
• Report system issues or inaccuracies immediately
• Not attempt to disable or tamper with sensors or equipment
• Follow role-specific protocols and permissions
• Keep login credentials secure and confidential
• Participate in system training when required`
    },
    {
      id: 7,
      title: "System Limitations and Liability",
      content: `Pyrolert provides monitoring services as an aid to fire safety but has limitations:

• The system is not infallible and may experience technical issues
• Sensor readings may be affected by environmental factors
• Network connectivity issues may delay alerts
• The system supplements but does not replace professional fire safety systems
• Users should maintain traditional fire safety equipment and protocols

Pyrolert shall not be liable for damages resulting from system failure, delayed alerts, or user actions taken based on system information. Users assume responsibility for their safety decisions.`
    },
    {
      id: 8,
      title: "Modifications to Terms",
      content: `We reserve the right to modify these terms at any time to reflect:

• Changes in system functionality or features
• Updates to legal or regulatory requirements
• Improvements to security or privacy practices
• Changes in operational procedures

Users will be notified of significant changes via email or system notification. Continued use of the system after modifications constitutes acceptance of the updated terms.`
    },
    {
      id: 9,
      title: "Account Termination",
      content: `User accounts may be suspended or terminated under the following circumstances:

• Violation of these Terms and Conditions
• Misuse of the system or unauthorized access attempts
• Prolonged inactivity (as defined by organizational policy)
• At the user's request
• Upon termination of employment or authorization

PyrolertAdministrators have the authority to immediately suspend accounts if system security is compromised.`
    },
    {
      id: 10,
      title: "Contact Information",
      content: `For questions, concerns, or support regarding these terms or the system:

• Contact your system administrator
• Email: support@pyrolert.com
• Emergency technical support: Available 24/7 through the system

For privacy-related inquiries, please contact your organization's data protection officer.

Last Updated: January 15, 2025
Version: 2.0`
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={() => router.push("/")} onSettings={() => router.push("/settings")} />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/settings")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>

            <Card>
              <CardHeader>
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold text-brand-blue">Terms & Conditions</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Last Updated: January 15, 2025 • Version 2.0
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-text-secondary mb-6">
                  Please review the following terms and conditions that govern your use of the Pyrolert system.
                </p>

                {/* Accordion Sections */}
                <div className="space-y-2">
                  {termsContent.map((section) => (
                    <Collapsible
                      key={section.id}
                      open={openSections[section.id]}
                      onOpenChange={() => toggleSection(section.id)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between w-full p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-3 text-left">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue font-bold text-sm shrink-0">
                              {section.id}
                            </span>
                            <h3 className="font-semibold text-brand-blue text-sm sm:text-base">
                              {section.title}
                            </h3>
                          </div>
                          {openSections[section.id] ? (
                            <ChevronDown className="h-5 w-5 text-brand-blue shrink-0" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 py-4 border-l-2 border-brand-blue/20 ml-6 mt-2">
                          {editingSection === section.id ? (
                            // Edit mode
                            <div className="space-y-3">
                              <Textarea
                                value={editableContent[section.id] || section.content}
                                onChange={(e) => setEditableContent(prev => ({
                                  ...prev,
                                  [section.id]: e.target.value
                                }))}
                                className="min-h-[200px] text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveSection(section.id)}
                                  className="bg-brand-blue hover:bg-brand-blue/90"
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditing}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // View mode
                            <div className="space-y-3">
                              <div className="text-sm text-text-primary leading-relaxed whitespace-pre-line">
                                {section.content}
                              </div>
                              {canEditTerms && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditing(section.id, section.content)}
                                  className="text-brand-blue hover:text-brand-blue/90 hover:bg-brand-blue/10"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit Section
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t">
                  <p className="text-xs text-muted-foreground">
                    By using Pyrolert, you agree to these terms and conditions.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => router.push("/settings")}
                    className="w-full sm:w-auto"
                  >
                    Back to Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
