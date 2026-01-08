import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ndk/ndk.dart';
import 'package:ndk_rust_verifier/data_layer/repositories/verifiers/rust_event_verifier.dart';

void main() {
  Get.put(RustEventVerifier());

  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        body: Center(
          child: FilledButton(
            onPressed: () async {
              final ndk = Ndk(
                NdkConfig(
                  eventVerifier: Get.find<RustEventVerifier>(),
                  cache: MemCacheManager(),
                ),
              );

              final events = await ndk.requests
                  .query(filter: Filter(kinds: [1]))
                  .future;

              print(events);
            },
            child: null,
          ),
        ),
      ),
    );
  }
}
