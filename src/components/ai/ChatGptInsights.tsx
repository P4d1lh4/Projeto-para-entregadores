
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type ChatGptInsightsProps = {
  deliveryData?: any[];
};

const ChatGptInsights: React.FC<ChatGptInsightsProps> = ({ deliveryData }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Please enter a question',
        description: 'Enter a question about your delivery data to get insights.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    // This is a placeholder function that simulates an AI response
    // In a real application, this would make an API call to an AI service
    await simulateAiResponse(prompt);
    
    setIsLoading(false);
  };
  
  // Function to simulate an AI response for demo purposes
  const simulateAiResponse = async (prompt: string) => {
    // Wait for 1-2 seconds to simulate network request
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    const dataSize = deliveryData?.length || 0;
    
    // Generate different responses based on the prompt
    let responseText = '';
    
    if (prompt.toLowerCase().includes('performance')) {
      responseText = `Based on the analysis of ${dataSize} deliveries, driver performance is generally positive. The average delivery success rate is 94.2%, with an average customer rating of 4.3/5. The top performing driver is Emily Johnson with a success rate of 98.7% and an average rating of 4.8/5. Areas for improvement include reducing average delivery time which is currently at 28 minutes.`;
    } else if (prompt.toLowerCase().includes('improve') || prompt.toLowerCase().includes('optimize')) {
      responseText = `To optimize your delivery operations, consider the following recommendations:\n\n1. Schedule deliveries during off-peak traffic hours to reduce transit time\n2. Implement route optimization to reduce driver travel distance\n3. Focus training on drivers with below-average ratings\n4. Consider expanding your delivery radius in high-demand areas like Dublin City Centre\n5. Implement a customer feedback loop to address recurring issues`;
    } else if (prompt.toLowerCase().includes('customer') || prompt.toLowerCase().includes('satisfaction')) {
      responseText = `Customer satisfaction data shows an overall positive trend with 87% of deliveries rated 4 stars or higher. The main factors affecting negative ratings are late deliveries and incorrect items. Consider implementing a real-time tracking system for customers and additional quality checks before dispatch to address these issues.`;
    } else if (prompt.toLowerCase().includes('trend') || prompt.toLowerCase().includes('pattern')) {
      responseText = `Analysis reveals several key patterns:\n\n1. Delivery volume peaks on Fridays and weekends\n2. Weather significantly impacts delivery times during winter months\n3. Average delivery time increases by 12% during rush hours (8-9am and 5-6pm)\n4. Customer satisfaction is highest for morning deliveries\n5. Areas with difficult parking have 15% higher delivery failure rates`;
    } else {
      responseText = `Based on the analysis of your ${dataSize} delivery records, I can see that your operation is performing well in the Dublin area. The average delivery success rate is 94.2%, with most deliveries completed in under 30 minutes. Your drivers are maintaining a solid average rating of 4.3/5 from customers.\n\nTo further improve performance, consider optimizing routes during peak traffic hours and focusing training on the bottom 20% of performers. You might also want to explore expanding coverage in the northern suburbs where demand appears to be growing.`;
    }
    
    setResponse(responseText);
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>AI Insights</CardTitle>
        <CardDescription>
          Ask questions about your delivery data to get AI-powered insights
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
          <div>
            <Textarea
              placeholder="What insights can you give me about driver performance? How can I optimize my delivery operations?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          {response && (
            <div className="rounded-md bg-secondary/30 p-4">
              <p className="text-sm whitespace-pre-line">{response}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Get Insights'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChatGptInsights;
