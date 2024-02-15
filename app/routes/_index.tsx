import { ActionFunctionArgs, json, redirect, type MetaFunction } from "@remix-run/node";
import { z } from "zod";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import * as fs from 'node:fs'
import { Button, Card, CardBody, CardHeader, Container, FormControl, FormErrorMessage, FormLabel, Heading, Input, Spinner } from '@chakra-ui/react'
import { useTransition } from "react";

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
  const validated = schema.safeParse(updates)

  if (!validated.success) {
    return json({errors: validated.error.issues});
  }

  let env = `FM_P2P_URL="${validated.data.p2p_url}"` + '\n'
  env += `FM_API_URL="${validated.data.api_url}"` + '\n'

  await new Promise<void>(resolve => fs.writeFile('.env', env, () => resolve()))

  return redirect(`/contacts/${params.contactId}`);
};

export default function Settings() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  return (
    <Container>
    <Card>
      <CardHeader>
      <Heading size='lg'>Fedimint Settings</Heading>
      </CardHeader>
      <CardBody>
        <Form id="settings-form" method="post">
          <FormControl isInvalid={!!actionData?.errors.find(e => e.path.find(p => p === 'p2p_url'))}>
            <FormLabel>Fedimint P2P URL</FormLabel>
            <Input
              aria-label="P2P URL"
              name="p2p_url"
              type="text"
              placeholder="fedimint://"
              errorBorderColor='red.300'
            />
            <FormErrorMessage>{actionData?.errors.find(e => e.path.find(p => p === 'p2p_url'))?.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!actionData?.errors.find(e => e.path.find(p => p === 'api_url'))}>
            <FormLabel>Fedimint API URL</FormLabel>
            <Input
              aria-label="API URL"
              name="api_url"
              placeholder="wss://"
              type="text"
              errorBorderColor='red.300'
            />
            <FormErrorMessage>{actionData?.errors.find(e => e.path.find(p => p === 'api_url'))?.message}</FormErrorMessage>
          </FormControl>
          <Button mt={5} size={'lg'} type="submit" colorScheme='blue'>{navigation.state == 'submitting' ? <Spinner></Spinner> : 'Save'}</Button>
        </Form>
      </CardBody>
    </Card>
    </Container>
  );
}

