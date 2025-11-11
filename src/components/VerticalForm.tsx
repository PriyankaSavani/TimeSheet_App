import React, { forwardRef } from 'react';
import { useForm, Resolver, SubmitHandler, FieldValues, FormProvider } from 'react-hook-form';

interface VerticalFromProps<TFormValues extends FieldValues> {
     defaultValues?: any;
     resolver?: Resolver<TFormValues>;
     children?: any;
     onSubmit: SubmitHandler<TFormValues>;
     formClass?: string;
}

const VerticalForm = forwardRef<HTMLFormElement, VerticalFromProps<any>>( (
     {
          defaultValues,
          resolver,
          children,
          onSubmit,
          formClass,
     },
     ref
) => {
     /*
      * form methods
      */
     const methods = useForm( { defaultValues, resolver } );

     return (
          <FormProvider { ...methods }>
               <form ref={ ref } onSubmit={ methods.handleSubmit( onSubmit ) } className={ formClass } noValidate>
                    { children }
               </form>
          </FormProvider>
     );
} );

export default VerticalForm;
