interface ShareBotOptions {
  botId: string;
  name?: string;
  description?: string;
}

export async function shareBot({ botId, name, description }: ShareBotOptions): Promise<{ success: boolean; copied?: boolean }> {
  const shareUrl = `${window.location.origin}/share/${botId}`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: name || 'Check out this bot!',
        text: description || 'I found this interesting bot you might like.',
        url: shareUrl
      });
      return { success: true };
    } else {
      await navigator.clipboard.writeText(shareUrl);
      return { success: true, copied: true };
    }
  } catch (error) {
    console.error('Error sharing:', error);
    return { success: false };
  }
}
