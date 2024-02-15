import { ActionFunctionArgs, json, redirect, type MetaFunction } from "@remix-run/node";
import { z } from "zod";
import { Form } from "@remix-run/react";
import * as fs from 'node:fs'
import { Button, FormControl, FormLabel, Input } from '@chakra-ui/react'

export const meta: MetaFunction = () => {
  return [
    { title: "Fedimint Config UI" },
    { name: "description", content: "Initial configuration settings for fedimint" },
  ];
};

export const loader = async () => {
  return json({});
};

const schema = z.object({
  api_url: z.string().url().startsWith('wss://'),
  p2p_url: z.string().url().startsWith('fedimint://')
})

export const action = async ({
  params,
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData();
  const updates = Object.fromEntries(formData);
  const validated = schema.parse(updates)
  let env = `FM_P2P_URL="${validated.p2p_url}"` + '\n'
  env += `FM_API_URL="${validated.api_url}"` + '\n'

  await new Promise<void>(resolve => fs.writeFile('.env', env, () => resolve()))

  return redirect(`/contacts/${params.contactId}`);
};

export default function EditContact() {
  return (
    <Form id="settings-form" method="post">
      <FormControl>
        <FormLabel>Fedimint P2P URL</FormLabel>
        <Input
          aria-label="P2P URL"
          name="p2p_url"
          type="text"
          placeholder="fedimint://"
        />
      </FormControl>
      <FormControl>
        <FormLabel>Fedimint API URL</FormLabel>
        <Input
          aria-label="API URL"
          name="api_url"
          placeholder="wss://"
          type="text"
        />
      </FormControl>
      <Button type="submit" colorScheme='blue'>Save</Button>
    </Form>
  );
}

