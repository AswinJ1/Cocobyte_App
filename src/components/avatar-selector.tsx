"use client"

import { useState } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AvatarSelectorProps {
  currentAvatar?: string
  gender: "male" | "female"
  onSave: (avatarUrl: string, gender: "male" | "female") => Promise<void>
  fallbackInitials: string
}

const MALE_AVATARS = [
  "https://api.dicebear.com/9.x/lorelei/svg?seed=Leo",
  "https://api.dicebear.com/9.x/lorelei/svg?seed=Oliver",
  "https://api.dicebear.com/9.x/lorelei/svg?seed=Avery",
  "https://api.dicebear.com/9.x/lorelei/svg?seed=Alexander",
  "https://api.dicebear.com/9.x/lorelei/svg?seed=Ryan"
]

const FEMALE_AVATARS = [
  "https://api.dicebear.com/9.x/lorelei/svg?seed=Ryker",
  "https://api.dicebear.com/9.x/lorelei/svg?seed=Katherine",
  "https://api.dicebear.com/9.x/lorelei/svg?seed=Sophia",
  "https://api.dicebear.com/9.x/lorelei/svg?seed=Luis",
  "https://api.dicebear.com/9.x/lorelei/svg?seed=Andrea",

]

export function AvatarSelector({
  currentAvatar,
  gender,
  onSave,
  fallbackInitials,
}: AvatarSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || "")
  const [selectedGender, setSelectedGender] = useState<"male" | "female">(gender)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await onSave(selectedAvatar, selectedGender)
      setIsOpen(false)
    } catch (error) {
      console.error("Error saving avatar:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="relative">
        <Avatar className="h-24 w-24 mb-4 cursor-pointer" onClick={() => setIsOpen(true)}>
          {currentAvatar ? (
            <AvatarImage src={currentAvatar} alt="Profile avatar" />
          ) : (
            <AvatarFallback className="bg-blue-600 text-white text-2xl">
              {fallbackInitials}
            </AvatarFallback>
          )}
        </Avatar>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="mt-2"
        >
          Change Avatar
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Choose Your Avatar</DialogTitle>
            <DialogDescription>
              Select your gender and choose an avatar that represents you
            </DialogDescription>
          </DialogHeader>

          <Tabs value={selectedGender} onValueChange={(value) => setSelectedGender(value as "male" | "female")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="male">Male</TabsTrigger>
              <TabsTrigger value="female">Female</TabsTrigger>
            </TabsList>

            <TabsContent value="male">
              <RadioGroup value={selectedAvatar} onValueChange={setSelectedAvatar}>
                <div className="grid grid-cols-4 gap-4 py-4">
                  {MALE_AVATARS.map((avatarUrl, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <RadioGroupItem
                        value={avatarUrl}
                        id={`male-avatar-${index}`}
                        className="sr-only"
                      />
                      <Label
                        htmlFor={`male-avatar-${index}`}
                        className={`cursor-pointer rounded-full p-1 transition-all ${
                          selectedAvatar === avatarUrl
                            ? "ring-4 ring-blue-600 ring-offset-2"
                            : "hover:ring-2 hover:ring-gray-300"
                        }`}
                      >
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={avatarUrl} alt={`Male Avatar ${index + 1}`} />
                          <AvatarFallback>{fallbackInitials}</AvatarFallback>
                        </Avatar>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </TabsContent>

            <TabsContent value="female">
              <RadioGroup value={selectedAvatar} onValueChange={setSelectedAvatar}>
                <div className="grid grid-cols-4 gap-4 py-4">
                  {FEMALE_AVATARS.map((avatarUrl, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <RadioGroupItem
                        value={avatarUrl}
                        id={`female-avatar-${index}`}
                        className="sr-only"
                      />
                      <Label
                        htmlFor={`female-avatar-${index}`}
                        className={`cursor-pointer rounded-full p-1 transition-all ${
                          selectedAvatar === avatarUrl
                            ? "ring-4 ring-blue-600 ring-offset-2"
                            : "hover:ring-2 hover:ring-gray-300"
                        }`}
                      >
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={avatarUrl} alt={`Female Avatar ${index + 1}`} />
                          <AvatarFallback>{fallbackInitials}</AvatarFallback>
                        </Avatar>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !selectedAvatar}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Avatar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}